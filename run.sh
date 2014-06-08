#!/bin/bash
ret=`python -c 'import sys; print("%i" % (sys.hexversion<0x03000000))'`
if [ $? -eq 0 ]; then
        if [ $ret -eq 0 ]; then
                python -m http.server 12345 &
        else
                python -m SimpleHTTPServer 12345 &
        fi
        xdg-open http://localhost:12345
else
        echo "Please install python or setup simple web server on port 12345 and serve content of this folder"
fi
