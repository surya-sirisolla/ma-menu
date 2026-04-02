package database

import (
	"context"
	"mamenu/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateTable(database, collection string, t models.Table) (*models.Table, error) {
	t.ID = primitive.NewObjectID()
	t.IsActive = true
	t.IsOccupied = false
	t.CreatedAt = time.Now()
	t.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(database, collection, t)
	if err != nil {
		return nil, err
	}

	t.ID = result.InsertedID.(primitive.ObjectID)
	return &t, nil
}

func (d *database) CreateManyTables(db, collection string, tables []models.Table) ([]*models.Table, error) {
	now := time.Now()
	docs := make([]any, len(tables))
	for i := range tables {
		tables[i].ID = primitive.NewObjectID()
		tables[i].IsActive = true
		tables[i].IsOccupied = false
		tables[i].CreatedAt = now
		tables[i].UpdatedAt = now
		docs[i] = tables[i]
	}

	_, err := d.mongo.InsertMany(db, collection, docs)
	if err != nil {
		return nil, err
	}

	result := make([]*models.Table, len(tables))
	for i := range tables {
		t := tables[i]
		result[i] = &t
	}
	return result, nil
}

func (d *database) GetTablesByHotel(database, collection string, hotelID primitive.ObjectID) ([]*models.Table, error) {
	cursor, err := d.mongo.Find(database, collection, bson.M{"hotel_id": hotelID, "is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	tables := make([]*models.Table, 0)
	if err := cursor.All(context.Background(), &tables); err != nil {
		return nil, err
	}
	return tables, nil
}

func (d *database) UpdateTable(database, collection string, id primitive.ObjectID, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateOne(database, collection, bson.M{"_id": id}, bson.M{"$set": data})
	return err
}

func (d *database) UpdateTableByFilter(database, collection string, filter bson.M, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateOne(database, collection, filter, bson.M{"$set": data})
	return err
}
