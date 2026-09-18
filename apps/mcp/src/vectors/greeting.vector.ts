import { VectorService } from "./vector.service";
import { GreetingModel, type GreetingType } from "@/database/models";

export class GreetingVector extends VectorService {
  async createHelloWorldEmbeddings(data: GreetingType) {
    await this.createVector(
      data,
      {},
      GreetingModel.collection.name,
      GreetingModel
    );
  }

  async getHelloWorld(query: string) {
    return await this.getResponseFromVectorSearch(
      query,
      GreetingModel.collection.name
    );
  }
}
