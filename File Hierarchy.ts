declare const Zotero: any
declare const OS: any

function log(msg, src: string="test") {
  Zotero.debug(`File hierarchy: ${src} -> ${msg}`)
}


interface IDescendent {
  id: number;
  name: string;
  key: string;
  // type is 'item' or 'collection'
  type: string;
  children?: IDescendent[];
}

interface IParentCollection {
  primary: {
    key: string;
  };
  fields: {
    name: string;
  }
  descendents: IDescendent[];
}

interface IItem {
  itemType: string;
  attachments?: any[];
  collections?: any[];
}


class Exporter {
  private path: Record<string, string> = {}
  private saved: Record<string, boolean> = {}

  constructor() { }

  public getPathsForCollection(collection: IParentCollection) {
    const rootPath = this.clean(collection.fields.name)
    let paths: Record<string, string> = {}
    paths[collection.primary.key] = rootPath

    log(collection, "parent-collection");
    log(collection.descendents, "parent-collection desc");
    for (let desc of collection.descendents){
      for (let res of this.getDescendentPathsRecursive(desc, rootPath)){
        const key = res[0];
        const subPath = res[1];
        paths[key] = subPath;
      }
    }

    return paths;
  }

  private *getDescendentPathsRecursive(descendent: IDescendent, parentFolder: string): IterableIterator<string[]> {
    if (descendent.type == "collection"){
      const cleanName = this.clean(descendent.name)
      const descendentFolder = this.join(parentFolder, cleanName)
      yield [descendent.key, descendentFolder];

      if (descendent.children != null) {
        for (let child of descendent.children) {
          for (const tuple of this.getDescendentPathsRecursive(child, descendentFolder)) {
            yield tuple;
          }
        }
      }
    }
  }

  private join(...p: string[]) {
    return p.filter(_ => _).join('/')
  }

  private register(collection, path?: string) {
    const key = (collection.primary ? collection.primary : collection).key
    const children = collection.children || collection.descendents || []
    const collections = children.filter(coll => coll.type === 'collection')
    const name = this.clean(collection.name)

    this.path[key] = this.join(path, name)

    for (collection of collections) {
      this.register(collection, this.path[key])
    }
  }

  clean(filename: string): string {
    const result = filename.replace(/[\x00-\x1F\x7F\/\\:*?"<>|$%]/g, encodeURIComponent);
    return result;
  }

  split(filename) {
    const dot = filename.lastIndexOf('.')
    return (dot < 1 || dot === (filename.length - 1)) ? [ filename, '' ] : [ filename.substring(0, dot), filename.substring(dot) ]
  }

  save(item: IItem) {
    log(JSON.stringify(item), "save_item");
    const attachments = (item.itemType === 'attachment') ? [ item ] : (item.attachments || [])
    let collections = (item.collections || []).map(key => this.path[key]).filter(coll => coll)
    if (!collections.length) collections = [ '' ] // if the item is not in a collection, save it in the root.

    for (const att of attachments) {
      if (!att.defaultPath) continue

      const [ base, ext ] = this.split(this.clean(att.filename))
      const subdir = att.contentType === 'text/html' ? base : ''

      for (const coll of collections) {
        log(JSON.stringify(coll), "collections");
        //const childs = coll.getChildItems();

        const path = this.join(coll, subdir, base)

        let filename = `${path}${ext}`
        let postfix = 0
        while (this.saved[filename.toLowerCase()]) {
          filename = `${path}_${++postfix}${ext}`
        }
        this.saved[filename.toLowerCase()] = true

        log(JSON.stringify(filename), "collections2")
        att.saveFile(filename, true)
        Zotero.write(`${filename}\n`)
      }
    }
  }
}

function doExport() {
  if (!Zotero.getOption('exportFileData')) throw new Error('File Hierarchy needs "Export File Data" to be on')

  const exporter = new Exporter();

  let finalPaths: Record<string, string> = {}
  let parentCollections: IParentCollection;

  while (parentCollections = Zotero.nextCollection()) {
    log(JSON.stringify(parentCollections), "constructor");
    const paths = exporter.getPathsForCollection(parentCollections);
    log(JSON.stringify(paths), "paths");
    finalPaths = Object.assign(finalPaths, paths)
  }

  log(JSON.stringify(finalPaths), "final paths");

  log('collections: ' + JSON.stringify(this.path), "constructor2")

  let item: IItem;
  while ((item = Zotero.nextItem())) {
    exporter.save(item)
  }
}
