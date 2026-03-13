package database

import (
	"context"
	"mamenu/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateMenuItem(database, collection string, m models.MenuItem) (*models.MenuItem, error) {
	m.ID = primitive.NewObjectID()
	m.IsAvailable = true
	m.CreatedAt = time.Now()
	m.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(database, collection, m)
	if err != nil {
		return nil, err
	}

	m.ID = result.InsertedID.(primitive.ObjectID)
	return &m, nil
}

func (d *database) GetMenuItemsByHotel(database, collection string, filter bson.M) ([]*models.MenuItem, error) {
	cursor, err := d.mongo.Find(database, collection, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	items := make([]*models.MenuItem, 0)
	if err := cursor.All(context.Background(), &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (d *database) UpdateMenuItem(database, collection string, id primitive.ObjectID, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateOne(database, collection, bson.M{"_id": id}, bson.M{"$set": data})
	return err
}
