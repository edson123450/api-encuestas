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




    // Obtener valores del cuerpo de la solicitud
    let tenantCPrograma, tipoCEstudiante, descripcion;
    if (typeof event.body === 'string') {
        const parsedBody = JSON.parse(event.body);
        tenantCPrograma = parsedBody['tenant_id#c_programa'];
        tipoCEstudiante = parsedBody['tipo#c_estudiante'];
        descripcion = parsedBody['descripcion'];
    } else {
        tenantCPrograma = event.body['tenant_id#c_programa'];
        tipoCEstudiante = event.body['tipo#c_estudiante'];
        descripcion = event.body['descripcion'];
    }

    try {
        // Crear los datos para el ítem a insertar
        const [tenantId, cPrograma] = tenantCPrograma.split('#');
        const [tipo, cEstudiante] = tipoCEstudiante.split('#');

        // Construir el ítem
        const item = {
            'tenant_id#c_programa': tenantCPrograma, // Partition Key (base)
            'tipo#c_estudiante': tipoCEstudiante,    // Sort Key (base)
            'tenant_id#tipo': `${tenantId}#${tipo}`, // Partition Key (GSI 1)
            'c_programa#c_estudiante': `${cPrograma}#${cEstudiante}`, // Sort Key (GSI 1)
            'tenant_id#c_estudiante': `${tenantId}#${cEstudiante}`, // Partition Key (GSI 2)
            'tipo#c_programa': `${tipo}#${cPrograma}`, // Sort Key (GSI 2)
            'descripcion': descripcion, // Atributo adicional
        };

        // Configurar los parámetros para la operación de escritura
        const params = {
            TableName: 'tabla_encuestas',
            Item: item,
        };

        // Insertar el ítem en la tabla
        await dynamoDB.put(params).promise();

        // Retornar una respuesta exitosa
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'success',
                message: 'Encuesta creada correctamente.',
                data: item,
            }, null, 2),
        };
    } catch (error) {
        console.error('Error al insertar en DynamoDB:', error);

        // Retornar error en caso de fallo
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Ocurrió un error al crear la encuesta.',
                error: error.message,
            }, null, 2),
        };
    }
};
