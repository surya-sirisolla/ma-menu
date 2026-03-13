package database

import (
	"context"
	"mamenu/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateHotel(database, collection string, hotel models.Hotel) (*models.Hotel, error) {
	hotel.ID = primitive.NewObjectID()
	hotel.IsActive = true
	hotel.CreatedAt = time.Now()
	hotel.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(database, collection, hotel)
	if err != nil {
		return nil, err
	}

	hotel.ID = result.InsertedID.(primitive.ObjectID)
	return &hotel, nil
}

func (d *database) GetAllHotels(database, collection string, filter bson.M) ([]*models.Hotel, error) {
	cursor, err := d.mongo.Find(database, collection, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	hotels := make([]*models.Hotel, 0)
	if err := cursor.All(context.Background(), &hotels); err != nil {
		return nil, err
	}
	return hotels, nil
}

func (d *database) GetHotelByID(database, collection string, id primitive.ObjectID) (*models.Hotel, error) {
	var hotel models.Hotel
	result, err := d.mongo.FindOne(database, collection, bson.M{"_id": id})
	if err != nil {
		return nil, err
	}
	if err := result.Decode(&hotel); err != nil {
		return nil, err
	}
	return &hotel, nil
}
