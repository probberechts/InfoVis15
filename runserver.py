"""
To run your application localy run this file.
"""

import os
with open(".env", "r") as f:
    for line in f:
        var, setting = line.split("=")
        os.environ[var] = setting

from app import app
app.run(debug=True)
