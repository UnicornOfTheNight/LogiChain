const { getDb, ObjectId } = require('../config/database');

/**
 * Classe abstraite fournissant les operations CRUD generiques via le driver
 * MongoDB officiel. Illustre l'heritage/polymorphisme demande par le cahier
 * des charges : chaque repository specialise herite de cette base.
 *
 * Regle N-Tier : AUCUNE autre couche (service, controller) ne doit importer
 * 'mongodb' ou manipuler directement le driver.
 */
class BaseRepository {
  constructor(collectionName) {
    if (this.constructor === BaseRepository) {
      throw new Error('BaseRepository est abstraite et ne peut pas etre instanciee directement.');
    }
    this.collectionName = collectionName;
  }

  get collection() {
    return getDb().collection(this.collectionName);
  }

  async create(document) {
    const result = await this.collection.insertOne(document);
    return { _id: result.insertedId, ...document };
  }

  async findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    return this.collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();
  }

  async count(filter = {}) {
    return this.collection.countDocuments(filter);
  }

  async deleteById(id) {
    return this.collection.deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = BaseRepository;
