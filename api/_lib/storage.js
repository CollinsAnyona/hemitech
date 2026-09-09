import { promises as fs } from 'node:fs';
import path from 'node:path';

// Storage adapters.
//
// On Vercel the filesystem is ephemeral: anything written at runtime is gone
// by the next invocation or deploy. So production must use object storage, and
// "blob" is the default whenever VERCEL is set. The "fs" adapter exists for
// local development and for the acceptance tests, and would also be the right
// choice on a VPS with a persistent disk.

const MEDIA_DIR = process.env.MEDIA_DIR
  ? path.resolve(process.env.MEDIA_DIR)
  : path.resolve(process.cwd(), 'media');

function chooseBackend() {
  const explicit = (process.env.MEDIA_STORAGE || '').toLowerCase();
  if (explicit === 'fs' || explicit === 'blob') return explicit;
  return process.env.VERCEL ? 'blob' : 'fs';
}

export const BACKEND = chooseBackend();

/** Public URL for a stored object. */
function publicUrl(filename, blobUrl) {
  const base = (process.env.MEDIA_PUBLIC_BASE || '').replace(/\/+$/, '');
  if (base) return `${base}/${filename}`;
  if (blobUrl) return blobUrl;
  const origin = (process.env.MEDIA_DEV_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');
  return `${origin}/media/${filename}`;
}

/* ------------------------------------------------------------------ fs ---- */

const fsAdapter = {
  async ensure() {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  },
  async exists(filename) {
    try {
      await fs.access(path.join(MEDIA_DIR, filename));
      return true;
    } catch {
      return false;
    }
  },
  async put(filename, buffer, contentType) {
    await this.ensure();
    const target = path.join(MEDIA_DIR, filename);
    // Belt and braces: the sanitiser already guarantees a flat name, but assert
    // the resolved path really is inside the media directory before writing.
    if (path.dirname(path.resolve(target)) !== MEDIA_DIR) {
      throw new Error('refusing to write outside the media directory');
    }
    await fs.writeFile(target, buffer);
    await fs.writeFile(
      `${target}.meta.json`,
      JSON.stringify({ contentType, uploadedAt: new Date().toISOString() }),
    );
    return {
      url: publicUrl(filename),
      filename,
      contentType,
      bytes: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  },
  async head(filename) {
    try {
      const stat = await fs.stat(path.join(MEDIA_DIR, filename));
      let meta = {};
      try {
        meta = JSON.parse(await fs.readFile(path.join(MEDIA_DIR, `${filename}.meta.json`), 'utf8'));
      } catch { /* sidecar optional */ }
      return {
        filename,
        bytes: stat.size,
        contentType: meta.contentType || 'application/octet-stream',
        uploadedAt: meta.uploadedAt || stat.mtime.toISOString(),
        url: publicUrl(filename),
      };
    } catch {
      return null;
    }
  },

  /** First `length` bytes, for magic-byte inspection without pulling the file. */
  async readRange(filename, length) {
    let handle;
    try {
      handle = await fs.open(path.join(MEDIA_DIR, filename), 'r');
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } catch {
      return null;
    } finally {
      await handle?.close();
    }
  },

  async fixContentType(filename, contentType) {
    try {
      const target = path.join(MEDIA_DIR, `${filename}.meta.json`);
      let meta = {};
      try {
        meta = JSON.parse(await fs.readFile(target, 'utf8'));
      } catch { /* recreate it */ }
      meta.contentType = contentType;
      await fs.writeFile(target, JSON.stringify(meta));
      return true;
    } catch {
      return false;
    }
  },

  /* Pending records live beside the file as "<name>.pending.json", reusing the
   * sidecar pattern already established for metadata. */
  async putPending(filename, record) {
    await this.ensure();
    await fs.writeFile(
      path.join(MEDIA_DIR, `${filename}.pending.json`),
      JSON.stringify(record),
    );
  },
  async getPending(filename) {
    try {
      return JSON.parse(
        await fs.readFile(path.join(MEDIA_DIR, `${filename}.pending.json`), 'utf8'),
      );
    } catch {
      return null;
    }
  },
  async delPending(filename) {
    await fs.rm(path.join(MEDIA_DIR, `${filename}.pending.json`), { force: true });
  },
  async listPending() {
    await this.ensure();
    const names = (await fs.readdir(MEDIA_DIR)).filter((n) => n.endsWith('.pending.json'));
    const out = [];
    for (const name of names) {
      try {
        const record = JSON.parse(await fs.readFile(path.join(MEDIA_DIR, name), 'utf8'));
        out.push(record);
      } catch { /* skip unreadable */ }
    }
    return out;
  },

  async list() {
    await this.ensure();
    const names = (await fs.readdir(MEDIA_DIR))
      .filter((n) => !n.endsWith('.meta.json') && !n.endsWith('.pending.json'));
    const out = [];
    for (const filename of names) {
      const stat = await fs.stat(path.join(MEDIA_DIR, filename));
      let meta = {};
      try {
        meta = JSON.parse(await fs.readFile(path.join(MEDIA_DIR, `${filename}.meta.json`), 'utf8'));
      } catch { /* metadata sidecar is optional */ }
      out.push({
        url: publicUrl(filename),
        filename,
        contentType: meta.contentType || 'application/octet-stream',
        bytes: stat.size,
        uploadedAt: meta.uploadedAt || stat.mtime.toISOString(),
      });
    }
    return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
  async del(filename) {
    await fs.rm(path.join(MEDIA_DIR, filename), { force: true });
    await fs.rm(path.join(MEDIA_DIR, `${filename}.meta.json`), { force: true });
  },
};

/** Raw write used only by the local Blob simulator in the dev server. */
export async function fsWriteDirect(filename, buffer, contentType) {
  return fsAdapter.put(filename, buffer, contentType);
}

/* ---------------------------------------------------------------- blob ---- */

let blobModule = null;
async function blobApi() {
  if (!blobModule) blobModule = await import('@vercel/blob');
  return blobModule;
}

const blobAdapter = {
  async exists(filename) {
    const { head } = await blobApi();
    try {
      await head(`media/${filename}`);
      return true;
    } catch {
      return false;
    }
  },
  async put(filename, buffer, contentType) {
    const { put } = await blobApi();
    const result = await put(`media/${filename}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,          // we control naming and collisions
      cacheControlMaxAge: 31536000,
    });
    return {
      url: publicUrl(filename, result.url),
      filename,
      contentType,
      bytes: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  },
  async head(filename) {
    const { head } = await blobApi();
    try {
      const meta = await head(`media/${filename}`);
      return {
        filename,
        bytes: meta.size,
        contentType: meta.contentType || 'application/octet-stream',
        uploadedAt: new Date(meta.uploadedAt).toISOString(),
        url: publicUrl(filename, meta.url),
        blobUrl: meta.url,
      };
    } catch {
      return null;
    }
  },

  /**
   * First `length` bytes via an HTTP Range request against the blob's own URL.
   * Pulling only the header avoids dragging an 80 MB video through the
   * function just to read its first four kilobytes.
   */
  async readRange(filename, length) {
    const meta = await this.head(filename);
    if (!meta) return null;
    try {
      const res = await fetch(meta.blobUrl, {
        headers: { Range: `bytes=0-${length - 1}` },
      });
      if (!res.ok && res.status !== 206) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  },

  /**
   * Blob stores the content type at write time and there is no in-place header
   * edit, so a correction means rewriting the object at the same pathname.
   */
  async fixContentType(filename, contentType) {
    const meta = await this.head(filename);
    if (!meta) return false;
    try {
      const { copy } = await blobApi();
      await copy(meta.blobUrl, `media/${filename}`, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });
      const after = await this.head(filename);
      return after?.contentType === contentType;
    } catch {
      return false;
    }
  },

  async putPending(filename, record) {
    const { put } = await blobApi();
    await put(`pending/${filename}.json`, JSON.stringify(record), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
  },
  async getPending(filename) {
    const { head } = await blobApi();
    try {
      const meta = await head(`pending/${filename}.json`);
      const res = await fetch(meta.url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
  async delPending(filename) {
    const { del, head } = await blobApi();
    try {
      const meta = await head(`pending/${filename}.json`);
      await del(meta.url);
    } catch {
      // idempotent: already gone
    }
  },
  async listPending() {
    const { list } = await blobApi();
    try {
      const { blobs } = await list({ prefix: 'pending/' });
      const out = [];
      for (const b of blobs) {
        try {
          const res = await fetch(b.url, { cache: 'no-store' });
          if (res.ok) out.push(await res.json());
        } catch { /* skip unreadable */ }
      }
      return out;
    } catch {
      return [];
    }
  },

  async list() {
    const { list } = await blobApi();
    const { blobs } = await list({ prefix: 'media/' });
    return blobs.map((b) => {
      const filename = b.pathname.replace(/^media\//, '');
      return {
        url: publicUrl(filename, b.url),
        filename,
        contentType: b.contentType || 'application/octet-stream',
        bytes: b.size,
        uploadedAt: new Date(b.uploadedAt).toISOString(),
      };
    }).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
  async del(filename) {
    const { del, head } = await blobApi();
    try {
      const meta = await head(`media/${filename}`);
      await del(meta.url);
    } catch {
      // idempotent: already gone
    }
  },
};

export const storage = BACKEND === 'blob' ? blobAdapter : fsAdapter;
export { MEDIA_DIR };

/**
 * The URL a not-yet-uploaded file will have, or null if it cannot be known.
 *
 * The client-upload flow has to promise a URL in step 1, before any bytes
 * exist. With MEDIA_PUBLIC_BASE set that is knowable. On the blob backend
 * without it, it is not: the store's own hostname only appears once the
 * object does. Returning null rather than guessing keeps the route from
 * handing an agent a URL that will never resolve.
 */
export function plannedPublicUrl(filename) {
  const base = (process.env.MEDIA_PUBLIC_BASE || '').replace(/\/+$/, '');
  if (base) return `${base}/${filename}`;
  if (BACKEND === 'blob') return null;
  return publicUrl(filename);
}
