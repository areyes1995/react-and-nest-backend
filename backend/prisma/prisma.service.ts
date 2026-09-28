import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

    const adapter = new PrismaPg({ connectionString: databaseUrl });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

//este codigo es de la documentacion de nest prisma, esto es lo que usaremos para conectar la app con LA BASE DE DATOS.

//RECORDAR QUE PARA USAR EL SERVICIO HAY QUE INYECTARLO EN OTRO SERVICIO, GENERALMENTE ESTA SERA LA MEJOR FORMA DE UTILIZARLO.
//SI VAMOS AL MODULO QUE TENEMOS CREADO Y VAMOS A SU SERVICIO, AHI, PONDREMOS UN CONTRUCTOR CON EL NUEVO SERVICIO

// TAMBIEN EN EL MODULO QUE USARA prisma, ponle en los PROVIDERS el servicio de prisma
