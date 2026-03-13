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
