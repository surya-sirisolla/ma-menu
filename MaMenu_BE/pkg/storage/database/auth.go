package database

import (
	"mamenu/models"

	"go.mongodb.org/mongo-driver/bson"
)

func (a *database) GetUserById(database, collection string, filter bson.M) (*models.User, error) {

	var user models.User

	result, err := a.mongo.FindOne(database, collection, filter)
	if err != nil {
		return nil, err
	}

	if err := result.Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}
