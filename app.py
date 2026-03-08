from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/guardar', methods=['POST'])
def guardar_menu():
    datos_menu = request.json
    print("Menú recibido para guardar:", datos_menu)
    return jsonify({
        "status": "success", 
        "message": "Menú guardado exitosamente en el sistema."
    }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)
