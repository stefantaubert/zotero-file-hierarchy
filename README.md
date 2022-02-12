# zotero-file-hierarchy

When installed in Zotero, this translator will allow exporting attachments of items in your Zotero Library or selected collection as files organized in folders. The exported attachments (files) will be organized in folders which reflect the hierarchical structure of your selected Zotero Library/Collections.

**How to install**
1.  Download the [File Hierarchy.js](https://raw.githubusercontent.com/retorquere/zotero-file-hierarchy/master/File%20Hierarchy.js "File Hierarchy.js") file from [zotero-file-hierarchy](https://github.com/retorquere/zotero-file-hierarchy) GitHub page
2. Move the "File Hierarchy.js" file to "[User home directory]/Zotero/translators" folder
3. Restart Zotero

**How to run**
1. Select and right click your My Library or a collection
2. Select "Export Library…"
3. Select format “File Hierarchy” and enable the checkbox for “Export Files”. Then click *OK*.
4. Select the target location for the export under “Where” and Save.

**Note to users:**
* Exported files will be duplicated if an item belongs to multiple collections

## Dev

https://www.zotero.org/support/dev/translators/coding

npm i @types/node

/opt/Zotero_linux-x86_64/zotero
after each start: Help -> Debug Output Logging -> Enable

## Concept

Export Notes, Attachments as JSON in one Line

Then python script that creates hardlinks of all files in folder

Attachment:

```json
{
    // "attachment"
    "type": string,
    // path to file
    "path": string,
    // collection structure
    "structure": string[],
    // parent item if one exist
    "item?": string,
}
```

Note:

```json
{
    // "note"
    "type": string,
    // content of note
    "content": string,
    // collection structure
    "structure": string[],
    // parent item if one exist
    "item?": string,
}
```

Item:

```json
{
    // "item"
    "type": string,
    // collection structure
    "structure": string[],
    "item": string,
}
```

Collection:

```json
{
    // "collection"
    "type": string,
    // collection structure
    "structure": string[],
}
```
