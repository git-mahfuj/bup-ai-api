import { baseConfig } from "@/config";
import { MongoDBAtlasVectorSearch, VoyageEmbeddings } from "@langchain/mongodb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Collection, Document } from "mongoose";
import type { DocumentInterface } from "@langchain/core/documents";
import mongoose from "mongoose";

/**
 * Service class for Retrieval-Augmented Generation (RAG) services.
 *
 * Provides shared utilities for managing MongoDB Atlas Vector Search indexes.
 * This class ensures that the required infrastructure for semantic search
 * is provisioned correctly before operations begin.
 *
 * @abstract
 */
export abstract class VectorService {
  protected async createSearchIndex(
    model: typeof mongoose.Model<Document>,
    indexName: string
  ) {
    const list_existed_indexes = await model.listSearchIndexes();

    if (list_existed_indexes.length > 0) {
      return;
    }

    /**
     * Provision the Vector Search Index.
     * Note: This operation is asynchronous and may take a few minutes
     * on the Atlas cluster to become 'Active'.
     */
    await model.createSearchIndex({
      name: indexName,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding", // The field where the Voyage vectors are stored
            numDimensions: 1024, // Specific to voyage-4 architecture
            similarity: "cosine", // Best for measuring semantic distance
          },
        ],
      },
    });
  }

  protected async createVector<T, D extends Document>(
    data: T,
    metaData: { [key: string]: string },
    collectionName: string,
    model: mongoose.Model<D>
  ) {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const output = await splitter.createDocuments([payload], [metaData]);

    const nativeCollection = mongoose.connection
      .getClient()
      .db(mongoose.connection.name)
      .collection(collectionName) as unknown as Collection;

    await MongoDBAtlasVectorSearch.fromDocuments(
      output,
      new VoyageEmbeddings({
        apiKey: baseConfig.VOYAGE_API_KEY,
        modelName: "voyage-4",
      }),
      {
        // @ts-ignore
        collection: nativeCollection,
        indexName: "default",
        textKey: "summary",
        embeddingKey: "embedding",
      }
    );

    await this.createSearchIndex(model, "default");
  }

  protected async getResponseFromVectorSearch(
    query: string,
    collectionName: string
  ): Promise<DocumentInterface[]> {
    const collection = mongoose.connection
      .getClient()
      .db(mongoose.connection.name)
      .collection(collectionName) as unknown as Collection;

    const vectorStore = new MongoDBAtlasVectorSearch(
      new VoyageEmbeddings({
        apiKey: baseConfig.VOYAGE_API_KEY,
        modelName: "voyage-4",
      }),
      {
        // @ts-ignore
        collection,
        indexName: "default",
        textKey: "summary",
        embeddingKey: "embedding",
      }
    );
    const retriever = vectorStore.asRetriever({
      searchType: "mmr",
      searchKwargs: {
        fetchK: 20,
        lambda: 1.0,
      },
    });

    const output = await retriever._getRelevantDocuments(query);
    return output;
  }
}
