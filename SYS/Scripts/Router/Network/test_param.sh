#!/bin/bash

hello() {
    echo $1
    sleep 1s
    echo $1
    sleep 1s
    echo $1
}

hello "hello world"