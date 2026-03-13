package database

import (
	"context"
	"time"

	"mamenu/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (d *database) CreateOrder(db, collection string, o models.Order) (*models.Order, error) {
	o.ID = primitive.NewObjectID()
	o.Status = models.OrderPending
	o.CreatedAt = time.Now()
	o.UpdatedAt = time.Now()

	result, err := d.mongo.InsertOne(db, collection, o)
	if err != nil {
		return nil, err
	}

	o.ID = result.InsertedID.(primitive.ObjectID)
	return &o, nil
}

func (d *database) GetOrdersByHotel(db, collection string, filter bson.M) ([]*models.Order, error) {
	cursor, err := d.mongo.Find(db, collection, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var orders []*models.Order
	if err := cursor.All(context.Background(), &orders); err != nil {
		return nil, err
	}
	if orders == nil {
		orders = []*models.Order{}
	}
	return orders, nil
}

func (d *database) GetOrderByID(db, collection string, id primitive.ObjectID) (*models.Order, error) {
	result, err := d.mongo.FindOne(db, collection, bson.M{"_id": id})
	if err != nil {
		return nil, err
	}
	var order models.Order
	if err := result.Decode(&order); err != nil {
		return nil, err
	}
	return &order, nil
}

func (d *database) UpdateOrderStatus(db, collection string, id primitive.ObjectID, data bson.M) error {
	data["updated_at"] = time.Now()
	_, err := d.mongo.UpdateById(db, collection, id, bson.M{"$set": data})
	return err
}
