import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

export interface TestContainers {
  mongodb: StartedMongoDBContainer;
  rabbitmq: StartedRabbitMQContainer;
}

export class TestContainerManager {
  private mongoContainer: StartedMongoDBContainer | null = null;
  private rabbitContainer: StartedRabbitMQContainer | null = null;

  async startMongoDB(): Promise<StartedMongoDBContainer> {
    console.log('Starting MongoDB container...');

    this.mongoContainer = await new MongoDBContainer('mongo:7').withExposedPorts(27017).start();

    console.log(`MongoDB container started at ${this.mongoContainer.getConnectionString()}`);
    return this.mongoContainer;
  }

  async startRabbitMQ(): Promise<StartedRabbitMQContainer> {
    console.log('Starting RabbitMQ container...');

    this.rabbitContainer = await new RabbitMQContainer('rabbitmq:3-management-alpine')
      .withExposedPorts(5672, 15672)
      .start();

    console.log(`RabbitMQ container started at ${this.rabbitContainer.getAmqpUrl()}`);
    return this.rabbitContainer;
  }

  async startAll(): Promise<TestContainers> {
    const [mongodb, rabbitmq] = await Promise.all([this.startMongoDB(), this.startRabbitMQ()]);

    return { mongodb, rabbitmq };
  }

  async stopMongoDB(): Promise<void> {
    if (this.mongoContainer) {
      console.log('Stopping MongoDB container...');
      await this.mongoContainer.stop();
      this.mongoContainer = null;
    }
  }

  async stopRabbitMQ(): Promise<void> {
    if (this.rabbitContainer) {
      console.log('Stopping RabbitMQ container...');
      await this.rabbitContainer.stop();
      this.rabbitContainer = null;
    }
  }

  async stopAll(): Promise<void> {
    await Promise.all([this.stopMongoDB(), this.stopRabbitMQ()]);
  }

  getMongoConnectionString(): string {
    if (!this.mongoContainer) {
      throw new Error('MongoDB container not started');
    }
    return this.mongoContainer.getConnectionString();
  }

  getRabbitMQUrl(): string {
    if (!this.rabbitContainer) {
      throw new Error('RabbitMQ container not started');
    }
    return this.rabbitContainer.getAmqpUrl();
  }

  getConnectionDetails(): { mongoUrl: string; rabbitUrl: string } {
    return {
      mongoUrl: this.getMongoConnectionString(),
      rabbitUrl: this.getRabbitMQUrl(),
    };
  }
}

export const testContainerManager = new TestContainerManager();
