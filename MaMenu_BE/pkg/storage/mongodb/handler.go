package mongodb

import (
	"context"
	"mamenu/pkg/logger"
	"os"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Imongodb interface {
	SetupMongoDBClient() error
	GetMongoDBClient() *mongo.Client
	DestroyClient() error
	FindOne(database, collection string, filter bson.M, options ...*options.FindOneOptions) *mongo.SingleResult
	DeleteOne(database, collection string, filter any) (*mongo.DeleteResult, error)
	DeleteMany(database, collection string, filter any) (*mongo.DeleteResult, error)
	InsertOne(database, collection string, data any) (*mongo.InsertOneResult, error)
	InsertMany(database, collection string, data []any) (*mongo.InsertManyResult, error)
	UpsertOne(database, collection string, filter, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error)
	UpsertMany(database, collection string, filter, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error)
	Find(database, collection string, filter bson.M) (*mongo.Cursor, error)
	UpdateOne(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error)
	UpdateMany(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error)
	CountDocument(database, collection string, filter bson.M) (*int64, error)
	Aggregation(database, collection string, data any) (*mongo.Cursor, error)
	UpdateById(database, collection string, id primitive.ObjectID, data any) (*mongo.UpdateResult, error)
}

type mongodb struct {
	client *mongo.Client
	logger *logger.LoggerHandler
}

func NewMongoDB(logger *logger.LoggerHandler) *mongodb {
	return &mongodb{
		logger: logger,
	}
}

func (m *mongodb) DestroyClient() error {
	if err := m.client.Disconnect(context.TODO()); err != nil {
		m.logger.WriteLog(logger.ErrorLog, "Error closing Connections : "+err.Error())
		return err
	}
	return nil
}

func (m *mongodb) GetMongoDBClient() *mongo.Client {
	return m.client
}

func (m *mongodb) SetupMongoDBClient() error {

	m.logger.WriteLog(logger.DebugLog, "Initiating MongoDB Client Setup")

	uri := os.Getenv("MONGO_URI")
	username := os.Getenv("MONGO_USERNAME")
	password := os.Getenv("MONGO_PASSWORD")
	authEnabled := os.Getenv("MONGO_AUTH_ENABLED")

	connectTimeoutStr := os.Getenv("MONGO_CONNECT_TIMEOUT")
	maxIdleStr := os.Getenv("MONGO_MAX_IDLE_TIME")
	maxPoolStr := os.Getenv("MONGO_MAX_POOL_SIZE")

	connectTimeout, _ := strconv.Atoi(connectTimeoutStr)
	maxIdle, _ := strconv.Atoi(maxIdleStr)
	maxPool, _ := strconv.Atoi(maxPoolStr)

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(connectTimeout)*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(uri).
		SetConnectTimeout(time.Duration(connectTimeout) * time.Second).
		SetMaxConnIdleTime(time.Duration(maxIdle) * time.Second).
		SetMaxPoolSize(uint64(maxPool)).
		SetRetryReads(true).
		SetRetryWrites(true)

	if authEnabled == "true" {
		clientOptions.SetAuth(options.Credential{
			Username: username,
			Password: password,
		})
	}

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		m.logger.WriteLog(logger.ErrorLog, "Mongo connection failed: "+err.Error())
		return err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		m.logger.WriteLog(logger.ErrorLog, "Mongo ping failed: "+err.Error())
		return err
	}

	m.client = client

	m.logger.WriteLog(logger.InfoLog, "MongoDB connected successfully")

	return nil
}

func (m *mongodb) FindOne(database, collection string, filter bson.M, options ...*options.FindOneOptions) *mongo.SingleResult {
	colobj := m.client.Database(database).Collection(collection)
	result := colobj.FindOne(context.Background(), filter, options...)
	return result
}

func (m *mongodb) Find(database, collection string, filter bson.M) (*mongo.Cursor, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.Find(context.Background(), filter)
	return result, err
}

func (m *mongodb) UpdateOne(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.UpdateOne(context.Background(), filter, data)
	return result, err
}

func (m *mongodb) UpdateMany(database, collection string, filter bson.M, data any) (*mongo.UpdateResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.UpdateMany(context.Background(), filter, data)
	return result, err
}
func (m *mongodb) CountDocument(database, collection string, filter bson.M) (*int64, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.CountDocuments(context.Background(), filter)
	return &result, err
}
func (m *mongodb) Aggregation(database, collection string, data any) (*mongo.Cursor, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.Aggregate(context.Background(), data)
	return result, err
}

func (m *mongodb) UpdateById(database, collection string, id primitive.ObjectID, data any) (*mongo.UpdateResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.UpdateByID(context.Background(), id, data)
	return result, err
}

func (m *mongodb) InsertOne(database, collection string, data any) (*mongo.InsertOneResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.InsertOne(context.Background(), data)
	return result, err
}

func (m *mongodb) InsertMany(database, collection string, data []any) (*mongo.InsertManyResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.InsertMany(context.Background(), data)
	return result, err
}

func (m *mongodb) DeleteOne(database, collection string, filter any) (*mongo.DeleteResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.DeleteOne(context.Background(), filter)
	return result, err
}

func (m *mongodb) DeleteMany(database, collection string, filter any) (*mongo.DeleteResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.DeleteMany(context.Background(), filter)
	return result, err
}

func (m *mongodb) UpsertOne(database, collection string, filter, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.UpdateOne(context.TODO(), filter, data, opts)
	return result, err
}

func (m *mongodb) UpsertMany(database, collection string, filter, data any, opts *options.UpdateOptions) (*mongo.UpdateResult, error) {
	colobj := m.client.Database(database).Collection(collection)
	result, err := colobj.UpdateMany(context.TODO(), filter, data, opts)
	return result, err
}
