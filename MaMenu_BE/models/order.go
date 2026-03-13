package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderConfirmed OrderStatus = "confirmed"
	OrderPreparing OrderStatus = "preparing"
	OrderReady     OrderStatus = "ready"
	OrderCompleted OrderStatus = "completed"
	OrderCancelled OrderStatus = "cancelled"
)

type OrderItem struct {
	ItemID   primitive.ObjectID `bson:"item_id" json:"item_id"`
	Name     string             `bson:"name" json:"name"`
	Price    float64            `bson:"price" json:"price"`
	Quantity int                `bson:"quantity" json:"quantity"`
	IsVeg    bool               `bson:"is_veg" json:"is_veg"`
}

type Order struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	HotelID      primitive.ObjectID `bson:"hotel_id" json:"hotel_id"`
	TableNumber  int                `bson:"table_number" json:"table_number"`
	TableLabel   string             `bson:"table_label" json:"table_label"`
	CustomerName string             `bson:"customer_name" json:"customer_name"`
	Items        []OrderItem        `bson:"items" json:"items"`
	Status       OrderStatus        `bson:"status" json:"status"`
	TotalAmount  float64            `bson:"total_amount" json:"total_amount"`
	Notes        string             `bson:"notes" json:"notes"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}
