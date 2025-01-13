import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CfnKnowledgeBase, CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import kebabCase from 'kebab-case';

interface BedrockStackProps extends cdk.StackProps {
  embeddingModelArn: string;
  pineconeEndpoint: string;
  pineconeSecretArn: string;
}

export class BedrockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BedrockStackProps) {
    super(scope, id, props);

    const { embeddingModelArn, pineconeEndpoint, pineconeSecretArn } =
      props || {
        embeddingModelArn: '',
        pineconeEndpoint: '',
        pineconeSecretArn: '',
      };

    // S3 Bucket (DataSourceBucket)
    const bucketNamePrefix = kebabCase(this.stackName, false);
    const dataSourceBucket = new s3.Bucket(this, 'DataSourceBucket', {
      bucketName: `${bucketNamePrefix}-rag-datasource-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM ManagedPolicy (ModelAccessPolicy)
    const modelAccessPolicy = new iam.ManagedPolicy(this, 'ModelAccessPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['bedrock:ListFoundationModels', 'bedrock:ListCustomModels'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['bedrock:InvokeModel'],
          resources: [embeddingModelArn],
        }),
      ],
    });

    // IAM ManagedPolicy (RagDataSourceAccessPolicy)
    const ragDataSourceAccessPolicy = new iam.ManagedPolicy(
      this,
      'RagDataSourceAccessPolicy',
      {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:ListBucket'],
            resources: [
              dataSourceBucket.bucketArn,
              `${dataSourceBucket.bucketArn}/*`,
            ],
          }),
        ],
      }
    );

    // IAM ManagedPolicy (SecretsManagerAccessPolicy)
    const secretsManagerAccessPolicy = new iam.ManagedPolicy(
      this,
      'SecretsManagerAccessPolicy',
      {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['secretsmanager:GetSecretValue'],
            resources: [pineconeSecretArn],
          }),
        ],
      }
    );

    // IAM Role (KnowledgeBaseRole)
    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      roleName: `${this.stackName}-role`,
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
          },
        },
      }),
    });
    knowledgeBaseRole.addManagedPolicy(modelAccessPolicy);
    knowledgeBaseRole.addManagedPolicy(ragDataSourceAccessPolicy);
    knowledgeBaseRole.addManagedPolicy(secretsManagerAccessPolicy);

    // KnowledgeBase
    const knowledgeBase = new CfnKnowledgeBase(this, 'KnowledgeBase', {
      name: `${this.stackName}-knowledgebase`,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn,
        },
      },
      roleArn: knowledgeBaseRole.roleArn,
      storageConfiguration: {
        type: 'PINECONE',
        pineconeConfiguration: {
          connectionString: pineconeEndpoint,
          credentialsSecretArn: pineconeSecretArn,
          fieldMapping: {
            metadataField: 'metadata',
            textField: 'text',
          },
        },
      },
    });

    // DataSource (S3DataSource)
    const dataSource = new CfnDataSource(this, 'S3DataSource', {
      name: `${this.stackName}-data-source`,
      knowledgeBaseId: knowledgeBase.ref,
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: dataSourceBucket.bucketArn,
        },
      },
    });

    // Output (KnowledgeBaseId)
    new cdk.CfnOutput(this, 'KnowledgeBaseId', {
      value: knowledgeBase.ref,
    });
  }
}
