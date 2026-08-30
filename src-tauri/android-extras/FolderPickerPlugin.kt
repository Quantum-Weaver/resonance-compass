// FolderPickerPlugin — the SAF folder picker (Storage Access Framework).
//
// Source of truth lives in src-tauri/android-extras/ (committed); the build
// copies it into gen/android/app/src/main/java/com/audhd/resonance_compass/plugin/
// via scripts/sync-android-extras.mjs because gen/ is gitignored and wiped by
// `tauri android init`. Loaded reflectively from Rust (folder_picker.rs) — the
// third plugin on the road MediaPermissionPlugin and MediaSessionPlugin walk.
//
// Why it exists: tauri-plugin-dialog's mobile branch answers every directory
// pick with FolderPickerNotImplemented (verified in plugin source, v2.7.1), so
// Android scanned two fixed public folders instead. This is the true folder
// choice (v1-v2-gap-report #6; KP's word 2026-08-30: "yes let us fix this"):
// ACTION_OPEN_DOCUMENT_TREE puts the system's own folder chooser on screen,
// the grant is taken persistable so it survives restarts with no manifest
// permission at all, and the tree is walked through DocumentsContract into
// content:// document URIs — which the Rust side already opens through
// tauri-plugin-fs's ContentResolver bridge, for the scan and for playback.
//
// Nothing is copied, moved, or written. Read grants only.

package com.audhd.resonance_compass.plugin

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import org.json.JSONObject

@InvokeArg
class TreeArgs {
  lateinit var uri: String
}

@TauriPlugin
class FolderPickerPlugin(private val activity: Activity) : Plugin(activity) {

  // What the scan treats as music. The mime is trusted first; the extension
  // catches providers that report application/octet-stream.
  private val audioExtensions = setOf(
    "mp3", "flac", "ogg", "oga", "opus", "wav", "m4a", "aac",
    "aif", "aiff", "wma", "m4b", "mka", "ape", "wv", "alac"
  )

  // ── pickFolder: the system chooser ─────────────────────────────────────────
  // Resolves { uri, name } on a pick and { uri: null } when the vessel backs
  // out. The grant is taken persistable before it is reported, so a folder
  // that is reported is a folder that can be read again after a restart.

  @Command
  fun pickFolder(invoke: Invoke) {
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
      addFlags(
        Intent.FLAG_GRANT_READ_URI_PERMISSION or
          Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
      )
    }
    // The call arrives on a Rust worker thread (spawn_blocking); the chooser
    // is launched from the main looper like any activity start.
    activity.runOnUiThread {
      startActivityForResult(invoke, intent, "onFolderPicked")
    }
  }

  @ActivityCallback
  fun onFolderPicked(invoke: Invoke, result: ActivityResult) {
    val res = JSObject()
    val uri = if (result.resultCode == Activity.RESULT_OK) result.data?.data else null
    if (uri == null) {
      res.put("uri", JSONObject.NULL)
      invoke.resolve(res)
      return
    }
    try {
      activity.contentResolver.takePersistableUriPermission(
        uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
      )
    } catch (e: SecurityException) {
      invoke.reject("The folder was chosen but its grant could not be kept: ${e.message}")
      return
    }
    res.put("uri", uri.toString())
    res.put("name", treeName(uri))
    invoke.resolve(res)
  }

  // ── listAudio: walk one granted tree into content:// document URIs ─────────
  // Runs off the calling thread: a large tree is a few hundred provider
  // queries, and the Rust side is already waiting on a blocking worker.

  @Command
  fun listAudio(invoke: Invoke) {
    val args = invoke.parseArgs(TreeArgs::class.java)
    val tree = Uri.parse(args.uri)
    Thread {
      try {
        val files = JSArray()
        val folders = intArrayOf(0)
        walk(tree, DocumentsContract.getTreeDocumentId(tree), files, folders, 0)
        val res = JSObject()
        res.put("files", files)
        res.put("folders", folders[0])
        invoke.resolve(res)
      } catch (e: Exception) {
        invoke.reject("The folder could not be read: ${e.message}")
      }
    }.start()
  }

  // Each audio file is reported with its FOLDER (the parent document's URI —
  // the key its art hangs on, built exactly as the store rebuilds it on load)
  // and, when the folder holds one, the folder's COVER image as a document
  // URI. The Rust scan copies that cover once into the app's covers dir, so a
  // picture sitting beside the tracks is found behind a provider just as it is
  // on a real path (KP, 2026-08-30: "does not even find the 2 that are sitting
  // in the folder with the audio tracks").
  private fun walk(tree: Uri, docId: String, out: JSArray, folders: IntArray, depth: Int) {
    if (depth > 32) return // a provider loop is not a library
    folders[0] += 1
    val children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId)
    val projection = arrayOf(
      DocumentsContract.Document.COLUMN_DOCUMENT_ID,
      DocumentsContract.Document.COLUMN_DISPLAY_NAME,
      DocumentsContract.Document.COLUMN_MIME_TYPE,
      DocumentsContract.Document.COLUMN_SIZE
    )
    val cursor = activity.contentResolver.query(children, projection, null, null, null) ?: return
    val folderUri = DocumentsContract.buildDocumentUriUsingTree(tree, docId).toString()
    val audio = ArrayList<JSObject>()
    val images = ArrayList<Pair<String, String>>() // display name · document id
    val subfolders = ArrayList<String>()
    cursor.use { c ->
      while (c.moveToNext()) {
        val id = c.getString(0) ?: continue
        val name = c.getString(1) ?: ""
        val mime = c.getString(2) ?: ""
        when {
          mime == DocumentsContract.Document.MIME_TYPE_DIR -> subfolders.add(id)
          isAudio(name, mime) -> {
            val f = JSObject()
            f.put("uri", DocumentsContract.buildDocumentUriUsingTree(tree, id).toString())
            f.put("name", name)
            f.put("mime", mime)
            f.put("size", if (c.isNull(3)) 0L else c.getLong(3))
            f.put("folder", folderUri)
            audio.add(f)
          }
          isImage(name, mime) -> images.add(Pair(name, id))
        }
      }
    }
    if (audio.isNotEmpty()) {
      val cover = pickCover(images)
      for (f in audio) {
        if (cover != null) {
          f.put("cover", DocumentsContract.buildDocumentUriUsingTree(tree, cover.second).toString())
          f.put("coverExt", cover.first.substringAfterLast('.', "jpg").lowercase())
        }
        out.put(f)
      }
    }
    for (sub in subfolders) walk(tree, sub, out, folders, depth + 1)
  }

  private fun isAudio(name: String, mime: String): Boolean {
    if (mime.startsWith("audio/") || mime == "application/ogg") return true
    val dot = name.lastIndexOf('.')
    if (dot < 0) return false
    return audioExtensions.contains(name.substring(dot + 1).lowercase())
  }

  private val imageExtensions = setOf("jpg", "jpeg", "png", "webp", "gif")
  private val coverStems = listOf("cover", "folder", "front", "album", "albumart", "artwork")

  private fun isImage(name: String, mime: String): Boolean {
    if (mime.startsWith("image/")) return true
    val dot = name.lastIndexOf('.')
    if (dot < 0) return false
    return imageExtensions.contains(name.substring(dot + 1).lowercase())
  }

  // The same rule the Rust scan applies to a real folder (pick_cover_name): a
  // named cover wins in stem order; failing that, a folder holding exactly one
  // image is an album folder with its art in it; two unnamed images are
  // ambiguous and left alone rather than guessed at.
  private fun pickCover(images: List<Pair<String, String>>): Pair<String, String>? {
    if (images.isEmpty()) return null
    for (stem in coverStems) {
      val hit = images.firstOrNull { it.first.substringBeforeLast('.').lowercase() == stem }
      if (hit != null) return hit
    }
    return if (images.size == 1) images[0] else null
  }

  // ── listPersisted: the folders this app may still read ─────────────────────
  // The grants Android kept for us — what "the library's folders" means on
  // this device. Rescans walk these; nothing is stored in the app's own base.

  @Command
  fun listPersisted(invoke: Invoke) {
    val arr = JSArray()
    for (p in activity.contentResolver.persistedUriPermissions) {
      if (p.isReadPermission && DocumentsContract.isTreeUri(p.uri)) {
        val o = JSObject()
        o.put("uri", p.uri.toString())
        o.put("name", treeName(p.uri))
        arr.put(o)
      }
    }
    val res = JSObject()
    res.put("folders", arr)
    invoke.resolve(res)
  }

  // ── releaseFolder: forget a folder ─────────────────────────────────────────
  // Gives the grant back. Rows already scanned from it stay in the library —
  // lose-nothing; the vessel removes tracks by signature, never a hand's sweep.

  @Command
  fun releaseFolder(invoke: Invoke) {
    val args = invoke.parseArgs(TreeArgs::class.java)
    try {
      activity.contentResolver.releasePersistableUriPermission(
        Uri.parse(args.uri), Intent.FLAG_GRANT_READ_URI_PERMISSION
      )
    } catch (_: SecurityException) {
      // Already released, or never persisted — either way it is gone.
    }
    invoke.resolve()
  }

  // A folder's own display name from its provider, else the tail of its
  // document id ("primary:Music" → "Music").
  private fun treeName(tree: Uri): String {
    val docId = try { DocumentsContract.getTreeDocumentId(tree) } catch (_: Exception) { return tree.toString() }
    try {
      val doc = DocumentsContract.buildDocumentUriUsingTree(tree, docId)
      activity.contentResolver.query(
        doc, arrayOf(DocumentsContract.Document.COLUMN_DISPLAY_NAME), null, null, null
      )?.use { c ->
        if (c.moveToFirst()) {
          val n = c.getString(0)
          if (!n.isNullOrEmpty()) return n
        }
      }
    } catch (_: Exception) {
      // fall through to the id's tail
    }
    val tail = docId.substringAfterLast(':').substringAfterLast('/')
    return if (tail.isEmpty()) docId else tail
  }
}
