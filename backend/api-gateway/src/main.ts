import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap api-gateway", error);
  process.exit(1);
});
