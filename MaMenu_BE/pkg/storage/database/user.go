package database

import (
	"context"
	"mamenu/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateUser(database, collection string, user models.User) (*models.User, error) {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(database, collection, user)
	if err != nil {
		return nil, err
	}

	user.ID = result.InsertedID.(primitive.ObjectID)
	return &user, nil
}

func (d *database) GetAllUsers(database, collection string, filter bson.M) ([]*models.User, error) {
	cursor, err := d.mongo.Find(database, collection, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	users := make([]*models.User, 0)
	if err := cursor.All(context.Background(), &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (d *database) AddHotelToOwner(database, collection string, ownerID, hotelID primitive.ObjectID) error {
	filter := bson.M{"_id": ownerID}
	update := bson.M{
		"$push": bson.M{"hotel_ids": hotelID},
		"$set":  bson.M{"updated_at": time.Now()},
	}

	_, err := d.mongo.UpdateOne(database, collection, filter, update)
	return err
}

func (d *database) UpdateUser(database, collection string, id primitive.ObjectID, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateOne(database, collection, bson.M{"_id": id}, bson.M{"$set": data})
	return err
}
