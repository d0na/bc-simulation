# API

This is the API folder for the BC Simulation project.

## Folders

The API folder contains the following folders:

- `/libs`: contains the API executable (`NMTSimulation.jar`) for the BC Simulation project.

## Endpoints

The API endpoints are as follows:

- `/simulation`: This endpoint returns the BC Simulation.

## Usage

To use the API, you can make a GET request to the `/simulation` endpoint 
<!-- with the following parameters: -->

<!-- - `/simulation?n=10&m=5&p=0.5&q=0.5`: This endpoint returns the BC Simulation with the given parameters. -->

## Example

To run the API, you can use the following command:

```bash
node api/server.js
```

This will start the API server on port 3000.

You can then make a GET request to the `/simulation` endpoint with the following parameters:

```bash
# curl http://localhost:3000/simulation?n=10&m=5&p=0.5&q=0.5 
curl http://localhost:3000/simulation 

```

This will return the BC Simulation.