package mongodb

import (
	"errors"
	"mamenu/pkg/logger"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoHandler struct {
	mongod Imongodb
	logger *logger.LoggerHandler
}

func NewMongoHandler(mongod Imongodb, logger *logger.LoggerHandler) *MongoHandler {
	return &MongoHandler{
		mongod: mongod,
		logger: logger,
	}
}

func (mh *MongoHandler) SetupClient() {
	mh.logger.WriteLog(logger.InfoLog, "Creating MongoDB Client")

	for {
		err := mh.mongod.SetupMongoDBClient()
		if err != nil {
			mh.logger.WriteLog(logger.ErrorLog, "Unable to create MongoDB client: "+err.Error())
			time.Sleep(15 * time.Second)
			continue
		}

		break
	}

	mh.logger.WriteLog(logger.InfoLog, "MongoDB client initialized successfully")
}

func (mh *MongoHandler) GetMongoDbClient() *mongo.Client {
	return mh.mongod.GetMongoDBClient()
}

func (mh *MongoHandler) DestroyClient() {
	mh.logger.WriteLog(logger.InfoLog, "Destriying MongoDB Client.")
	err := mh.mongod.DestroyClient()
	for {

		if err != nil {
			mh.logger.WriteLog(logger.ErrorLog, "Unable to destroy mongoDB client : "+err.Error())
			err = mh.mongod.DestroyClient()
			time.Sleep(15 * time.Second)
			continue
		}
		break
	}
}

func (m *MongoHandler) FindOne(database, collection string, filter bson.M, options ...*options.FindOneOptions) (*mongo.SingleResult, error) {
	if database == "" {
		return &mongo.SingleResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.SingleResult{}, errors.New("empty collection string")
	}
	result := m.mongod.FindOne(database, collection, filter, options...)
	return result, nil
}

func (m *MongoHandler) InsertOne(database, collection string, data any) (*mongo.InsertOneResult, error) {
	if database == "" {
		return &mongo.InsertOneResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.InsertOneResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.InsertOne(database, collection, data)
	return result, err
}

func (m *MongoHandler) InsertMany(database, collection string, data []any) (*mongo.InsertManyResult, error) {
	if database == "" {
		return &mongo.InsertManyResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.InsertManyResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.InsertMany(database, collection, data)
	return result, err
}

func (m *MongoHandler) DeleteOne(database, collection string, filter any) (*mongo.DeleteResult, error) {
	if database == "" {
		return &mongo.DeleteResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.DeleteResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.DeleteOne(database, collection, filter)
	return result, err
}

func (m *MongoHandler) DeleteMany(database, collection string, filter any) (*mongo.DeleteResult, error) {
	if database == "" {
		return &mongo.DeleteResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.DeleteResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.DeleteMany(database, collection, filter)
	return result, err
}

func (m *MongoHandler) Find(database, collection string, filter bson.M) (*mongo.Cursor, error) {
	if database == "" {
		return &mongo.Cursor{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.Cursor{}, errors.New("empty collection string")
	}
	result, err := m.mongod.Find(database, collection, filter)
	return result, err
}

func (m *MongoHandler) Aggregation(database, collection string, data any) (*mongo.Cursor, error) {
	if database == "" {
		return &mongo.Cursor{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.Cursor{}, errors.New("empty collection string")
	}
	result, err := m.mongod.Aggregation(database, collection, data)
	return result, err
}

func (m *MongoHandler) UpdateOne(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error) {
	if database == "" {
		return &mongo.UpdateResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.UpdateResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.UpdateOne(database, collection, filter, data)
	return result, err
}

func (m *MongoHandler) UpdateMany(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error) {
	if database == "" {
		return &mongo.UpdateResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.UpdateResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.UpdateMany(database, collection, filter, data)
	return result, err
}
func (m *MongoHandler) UpsertOne(database, collection string, filter bson.M, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error) {
	if database == "" {
		return &mongo.UpdateResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.UpdateResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.UpsertOne(database, collection, filter, data, opts)
	return result, err
}

func (m *MongoHandler) UpsertMany(database, collection string, filter bson.M, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error) {
	if database == "" {
		return &mongo.UpdateResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.UpdateResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.UpsertMany(database, collection, filter, data, opts)
	return result, err
}

func (m *MongoHandler) UpdateById(database, collection string, Id primitive.ObjectID, data any) (*mongo.UpdateResult, error) {
	if database == "" {
		return &mongo.UpdateResult{}, errors.New("empty database string")
	}
	if collection == "" {
		return &mongo.UpdateResult{}, errors.New("empty collection string")
	}
	result, err := m.mongod.UpdateById(database, collection, Id, data)
	return result, err
}

func (m *MongoHandler) CountDocument(database, collection string, filter bson.M) (int64, error) {
	if database == "" {
		return 0, errors.New("empty database string")
	}
	if collection == "" {
		return 0, errors.New("empty collection string")
	}
	result, err := m.mongod.CountDocument(database, collection, filter)
	return *result, err
}
