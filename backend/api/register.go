package api

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Usuario struct {
	Nombres    string `json:"nombres"`
	Apellidos  string `json:"apellidos"`
	Cedula     string `json:"cedula"`
	Correo     string `json:"correo"`
	Telefono   string `json:"telefono"`
	Contrasena string `json:"contrasena"`
	Foto       string `json:"foto"`
}

type Response struct {
	Status  string      `json:"status"`
	Mensaje string      `json:"mensaje"`
	Data    interface{} `json:"data,omitempty"`
}

var client *mongo.Client

func init() {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("❌ ERROR: La variable de entorno MONGO_URI no está definida")
	}

	clientOptions := options.Client().ApplyURI(mongoURI).
		SetTLSConfig(&tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: true,
		}).
		SetServerSelectionTimeout(10 * time.Second).
		SetConnectTimeout(10 * time.Second)

	var err error
	client, err = mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal("❌ ERROR: No se pudo conectar a MongoDB:", err)
	}
}

// Handler es la función principal que maneja todas las solicitudes HTTP
func Handler(w http.ResponseWriter, r *http.Request) {
	// Configurar CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")

	// Manejar solicitud OPTIONS
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Obtener la colección de usuarios
	collection := client.Database("qrtixpro").Collection("usuarios")

	// Manejar diferentes rutas
	switch r.URL.Path {
	case "/api/registro":
		if r.Method != http.MethodPost {
			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
			return
		}

		var usuario Usuario
		if err := json.NewDecoder(r.Body).Decode(&usuario); err != nil {
			responseWithError(w, http.StatusBadRequest, "Datos inválidos")
			return
		}

		// Verificar si ya existe un usuario con la misma cédula
		var usuarioExistente Usuario
		err := collection.FindOne(context.Background(), bson.M{"cedula": usuario.Cedula}).Decode(&usuarioExistente)
		if err == nil {
			responseWithError(w, http.StatusConflict, "Ya existe un usuario con esta cédula")
			return
		}

		// Insertar nuevo usuario
		_, err = collection.InsertOne(context.Background(), usuario)
		if err != nil {
			responseWithError(w, http.StatusInternalServerError, "Error al registrar usuario")
			return
		}

		responseWithJSON(w, http.StatusOK, Response{
			Status:  "success",
			Mensaje: "Usuario registrado con éxito",
		})

	default:
		http.Error(w, "Ruta no encontrada", http.StatusNotFound)
	}
}

func responseWithError(w http.ResponseWriter, code int, message string) {
	responseWithJSON(w, code, Response{
		Status:  "error",
		Mensaje: message,
	})
}

func responseWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}
