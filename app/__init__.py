import os
from flask.ext.moresql import MoreSQL
from flask import Flask, render_template, request


app = Flask(__name__)
app.config['MORESQL_DATABASE_URI'] = os.environ['DATABASE_URL']
db = MoreSQL(app)
if 'SECRET_KEY' in os.environ:
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
else:
    app.config['SECRET_KEY'] = 'this_should_be_configured'
cors = CORS(app, resources={r"/data/*": {"origins": "*"}})


###
# Routing for your application.
###
@app.route('/')
def home():
    """Render website's home page."""
    return render_template('home.html')


###
# data API
###
@app.route('/data/jaar_totaal/', methods=['GET'])
def get_jaar_totaal():
    if request.values.get('soort'):
        modified_values = {
            'soort': request.values.get('soort').title(),
        }
        return db.execute('get_jaar_totaal',
                          fields=['soort'],
                          values=modified_values)

    return db.execute('get_jaar_totaal')


@app.route('/data/observaties/', methods=['GET'])
def get_observaties():
    if (request.values.get('soort') and
            request.values.get('start_date') and
            request.values.get('end_date')):
        modified_values = {
            'soort': request.values.get('soort').title(),
            'start_date': request.values.get('start_date'),
            'end_date': request.values.get('end_date')
        }
        return db.execute('get_observaties',
                          fields=['soort', 'start_date', 'end_date'],
                          values=modified_values)
    if request.values.get('soort'):
        modified_values = {
            'soort': request.values.get('soort').title(),
        }
        return db.execute('get_observaties',
                          fields=['soort'],
                          values=modified_values)
    if (request.values.get('start_date') and
            request.values.get('end_date')):
        modified_values = {
            'start_date': request.values.get('start_date'),
            'end_date': request.values.get('end_date')
        }
        return db.execute('get_observaties',
                          fields=['start_date', 'end_date'],
                          values=modified_values)

    return db.execute('get_observaties')


@app.route('/data/soorten/', methods=['GET'])
def get_soorten():
    return db.execute('get_soorten')


###
# The functions below should be applicable to all Flask apps.
###

@app.route('/<file_name>.txt')
def send_text_file(file_name):
    """Send your static text file."""
    file_dot_text = file_name + '.txt'
    return app.send_static_file(file_dot_text)


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=600'
    return response


@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True)
