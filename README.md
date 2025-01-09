# cdk

AWS環境構築を行うためのCDK

## 事前準備

### AWS CLI の設定

`$ brew install awscli`

### AWS CLI で利用する credentials の設定

`~/.aws/credentials`

```plain
[profile]
aws_access_key_id =
aws_secret_access_key =
```

### ブートストラップ用のIAMの用意

必要なポリシー [参照](https://github.com/aws/aws-cdk/wiki/Security-And-Safety-Dev-Guide#policies-for-bootstrapping)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "ecr:*",
                "ssm:*",
                "s3:*",
                "iam:*"
            ],
            "Resource": "*"
        }
    ]
}
```
