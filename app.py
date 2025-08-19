from flask import Flask, jsonify, render_template, send_from_directory
import csv

app = Flask(__name__)

def load_components():
    components = []
    with open('./static/components.json', encoding='utf-8') as jsonfile:
        components = jsonfile.load(jsonfile) 
    return components

@app.route('/components', methods=['GET'])
def get_components():
    return jsonify(load_components())

@app.route('/sw.js')
def service_worker():
    return send_from_directory('.', 'sw.js')

# اضافه کردن مسیر صفحه اصلی
@app.route('/')
def index():
    return render_template('index.html')
    

if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)

