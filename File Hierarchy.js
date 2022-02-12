{
  "translatorID": "86ffd88b-6f4e-4bec-a5be-839c1034beb2",
  "label": "File Hierarchy",
  "description": "Export files according to collection organisation",
  "creator": "Emiliano Heyns",
  "target": "txt",
  "minVersion": "4.0.27",
  "maxVersion": "",
  "configOptions": {
    "getCollections": true
  },
  "displayOptions": {
    "exportFileData": true
  },
  "translatorType": 2,
  "browserSupport": "gcsv",
  "priority": 100,
  "inRepository": false,
  "lastUpdated": "2022-02-12 12:04:41"
}

function debug(msg, src = "test") {
    Zotero.debug(`File hierarchy: ${src} -> ${msg}`);
}
class Collections {
    constructor() {
        this.path = {};
        this.saved = {};
        let coll;
        while (coll = Zotero.nextCollection()) {
            this.register(coll);
            debug(JSON.stringify(coll), "constructor");
        }
        debug('collections: ' + JSON.stringify(this.path), "constructor2");
    }
    join(...p) {
        return p.filter(_ => _).join('/');
    }
    register(collection, path) {
        const key = (collection.primary ? collection.primary : collection).key;
        const children = collection.children || collection.descendents || [];
        const collections = children.filter(coll => coll.type === 'collection');
        const name = this.clean(collection.name);
        this.path[key] = this.join(path, name);
        for (collection of collections) {
            this.register(collection, this.path[key]);
        }
    }
    clean(filename) {
        return filename.replace(/[\x00-\x1F\x7F\/\\:*?"<>|$%]/g, encodeURIComponent);
    }
    split(filename) {
        const dot = filename.lastIndexOf('.');
        return (dot < 1 || dot === (filename.length - 1)) ? [filename, ''] : [filename.substring(0, dot), filename.substring(dot)];
    }
    save(item) {
        debug(JSON.stringify(item), "save_item");
        const attachments = (item.itemType === 'attachment') ? [item] : (item.attachments || []);
        let collections = (item.collections || []).map(key => this.path[key]).filter(coll => coll);
        if (!collections.length)
            collections = ['']; // if the item is not in a collection, save it in the root.
        for (const att of attachments) {
            if (!att.defaultPath)
                continue;
            const [base, ext] = this.split(this.clean(att.filename));
            const subdir = att.contentType === 'text/html' ? base : '';
            for (const coll of collections) {
                debug(JSON.stringify(coll), "collections");
                //const childs = coll.getChildItems();
                const path = this.join(coll, subdir, base);
                let filename = `${path}${ext}`;
                let postfix = 0;
                while (this.saved[filename.toLowerCase()]) {
                    filename = `${path}_${++postfix}${ext}`;
                }
                this.saved[filename.toLowerCase()] = true;
                debug(JSON.stringify(filename), "collections2");
                att.saveFile(filename, true);
                Zotero.write(`${filename}\n`);
            }
        }
    }
}
function doExport() {
    if (!Zotero.getOption('exportFileData'))
        throw new Error('File Hierarchy needs "Export File Data" to be on');
    const collections = new Collections;
    let item;
    while ((item = Zotero.nextItem())) {
        collections.save(item);
    }
}
