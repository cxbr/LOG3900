import { AppModule } from '@app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
const serviceAccountPath = path.resolve('app/constants/log3900app-firebase-adminsdk-h94oo-3cae6f97d4.json');
const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const bootstrap = async () => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();
    app.use(json({ limit: '100mb' }));
    app.useStaticAssets(join(__dirname, '../../..', 'assets'));
    app.use(urlencoded({ extended: true, limit: '100mb' }));
    const config = new DocumentBuilder()
        .setTitle('Server - Jeu des différences')
        .setDescription('Serveur du projet 3, équipe 101, pour le cours de LOG3900')
        .setVersion('0.1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    SwaggerModule.setup('', app, document);

    await app.listen(process.env.PORT);
};

bootstrap();
