#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BedrockStack } from '../lib/bedrock-stack';
import * as dotenv from 'dotenv';

dotenv.config();

// 環境変数を取得
const account = process.env.ACCOUNT_ID;
const region = process.env.REGION;
const embeddingModelArn = process.env.EMBEDDING_MODEL_ARN;
const pineconeEndpoint = process.env.PINECONE_ENDPOINT;
const pineconeSecretArn = process.env.PINECONE_SECRET_ARN;

if (
  !account ||
  !region ||
  !embeddingModelArn ||
  !pineconeEndpoint ||
  !pineconeSecretArn
) {
  throw new Error('.envファイルの設定値が不足しています。');
}

const app = new cdk.App();
new BedrockStack(app, 'BedrockStack', {
  env: { account, region },
  embeddingModelArn,
  pineconeEndpoint,
  pineconeSecretArn,
});
