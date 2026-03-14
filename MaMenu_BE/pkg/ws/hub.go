package ws

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// Message is the envelope sent over all WebSocket connections.
type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Client wraps a single WebSocket connection.
type Client struct {
	conn *websocket.Conn
	send chan []byte
}

// Hub manages all active WebSocket connections.
//
// - hotelRooms: hotel_id → set of connected hotel-admin clients
// - orderRooms: order_id → set of connected customer clients
type Hub struct {
	mu         sync.RWMutex
	hotelRooms map[string]map[*Client]bool
	orderRooms map[string]map[*Client]bool
}

// NewHub creates and returns a ready-to-use Hub.
func NewHub() *Hub {
	return &Hub{
		hotelRooms: make(map[string]map[*Client]bool),
		orderRooms: make(map[string]map[*Client]bool),
	}
}

// NewClient creates a Client and starts its write pump in a goroutine.
func NewClient(conn *websocket.Conn) *Client {
	c := &Client{conn: conn, send: make(chan []byte, 64)}
	go c.writePump()
	return c
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

// Close drains and closes the client's send channel.
func (c *Client) Close() {
	close(c.send)
}

// RegisterHotelAdmin adds a client to the hotel's admin room.
func (h *Hub) RegisterHotelAdmin(hotelID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.hotelRooms[hotelID] == nil {
		h.hotelRooms[hotelID] = make(map[*Client]bool)
	}
	h.hotelRooms[hotelID][c] = true
}

// UnregisterHotelAdmin removes a client from the hotel's admin room.
func (h *Hub) UnregisterHotelAdmin(hotelID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.hotelRooms[hotelID]; ok {
		delete(room, c)
	}
}

// RegisterOrderWatcher adds a client to an order's watcher room.
func (h *Hub) RegisterOrderWatcher(orderID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.orderRooms[orderID] == nil {
		h.orderRooms[orderID] = make(map[*Client]bool)
	}
	h.orderRooms[orderID][c] = true
}

// UnregisterOrderWatcher removes a client from an order's watcher room.
func (h *Hub) UnregisterOrderWatcher(orderID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.orderRooms[orderID]; ok {
		delete(room, c)
	}
}

// BroadcastToHotel sends msg to every admin connected to the given hotel.
func (h *Hub) BroadcastToHotel(hotelID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.hotelRooms[hotelID] {
		select {
		case c.send <- data:
		default:
		}
	}
}

// BroadcastToOrder sends msg to every customer watching the given order.
func (h *Hub) BroadcastToOrder(orderID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.orderRooms[orderID] {
		select {
		case c.send <- data:
		default:
		}
	}
}
