package database

import (
	"context"
	"mamenu/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateCategory(database, collection string, c models.Category) (*models.Category, error) {
	c.ID = primitive.NewObjectID()
	c.IsActive = true
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(database, collection, c)
	if err != nil {
		return nil, err
	}

	c.ID = result.InsertedID.(primitive.ObjectID)
	return &c, nil
}

func (d *database) GetCategoriesByHotel(database, collection string, hotelID primitive.ObjectID) ([]*models.Category, error) {
	cursor, err := d.mongo.Find(database, collection, bson.M{"hotel_id": hotelID, "is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	categories := make([]*models.Category, 0)
	if err := cursor.All(context.Background(), &categories); err != nil {
		return nil, err
	}
	return categories, nil
}

func (d *database) UpdateCategory(database, collection string, id primitive.ObjectID, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateOne(database, collection, bson.M{"_id": id}, bson.M{"$set": data})
	return err
}
