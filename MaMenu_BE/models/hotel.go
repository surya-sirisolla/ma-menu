package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Hotel struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	OwnerID   primitive.ObjectID `bson:"owner_id" json:"owner_id"`
	Phone     string             `bson:"phone" json:"phone"`
	Email     string             `bson:"email" json:"email"`
	Address   string             `bson:"address" json:"address"`
	City      string             `bson:"city" json:"city"`
	State     string             `bson:"state" json:"state"`
	Country   string             `bson:"country" json:"country"`
	Pincode   string             `bson:"pincode" json:"pincode"`
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}
