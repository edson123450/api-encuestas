// Importar el SDK de AWS
const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const lambdaClient = new AWS.Lambda();

exports.lambda_handler = async (event) => {

    // Obtener el token del encabezado
    const token = event.headers?.Authorization;
    if (!token) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Token no proporcionado. Acceso no autorizado.',
            }, null, 2),
        };
    }

    // Invocar el Lambda para validar el token
    const payload = { token };
    const invokeParams = {
        FunctionName: 'ValidarTokenEstudiante', // Nombre del Lambda de validación
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
    };

    const invokeResponse = await lambdaClient.invoke(invokeParams).promise();
    const validationResponse = JSON.parse(invokeResponse.Payload);

    if (validationResponse.statusCode === 403) {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Acceso no autorizado. Token inválido.',
            }, null, 2),
        };
    }


    // Obtener el tenant_id desde el body
    let tenantId;
    if (typeof event.body === 'string') {
        tenantId = JSON.parse(event.body)['tenant_id'];
    } else {
        tenantId = event.body['tenant_id'];
    }

    try {
        // Configurar parámetros para el escaneo
        const params = {
            TableName: 'tabla_encuestas',
        };

        // Escanear la tabla
        const data = await dynamoDB.scan(params).promise();

        // Filtrar los ítems cuyo partition key comience con el tenant_id
        const encuestas = data.Items.filter(item => 
            item['tenant_id#c_programa'].startsWith(tenantId)
        );

        // Retornar los datos filtrados
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                status: 'success',
                data: encuestas,
            },
        };
    } catch (error) {
        console.error('Error al escanear DynamoDB:', error);

        // Manejar errores
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Ocurrió un error al listar las encuestas.',
                error: error.message,
            }, null, 2),
        };
    }
};
