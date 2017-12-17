# Cloud Assistant Functions

Lambda function that implements __Cloud Assistant Alexa Skill__ `beta`.

This function captures the requests from skill, and verify for user permissions in a __DynamoDB__ table called __ClusterPermission__.

If exists the __user_id__ and __cluster_name__ in that table, the request is forwarded for the Cloud Assistant in the configured cluster, otherwise is returned a message saying _User not found in permissions table_ or _Cluster not found_ __cluster_name__ _in your permissions._

The permissions table have the structure below.

```
"Item": {
    "user_id": <Amazon User ID>,
    "clusters": [
        {
            "name": <Cluster Name>,
            "address": {
                "protocol": <Protocol http or https>,
                "port": <Port Number>,
                "host": <Hostname/IP Address>
            },
            "additional_headers": {
                <Map With Additional Headers>
            }
        }
    ]
}
```

Example:

```
"Item": {
    "user_id": "amzn1.ask.account.AGZ6TBX2XXNJNTTJUMEVJGUAYHLAOBAOUJSCHAFSHDXKGD5YQPVWM6QOQ6GXHQJZUKLOTVB5LM5XHOMNTQFJBUN2WJY3Q5D2L4X76DM32PVIMPUTWUFCGL322Y2YHB2U4H2GG4D5ZRFPWXBUGKHAU47YZJUV3CAJJY4IXZH54T65Z3BNEVAGTZYB4VKACIDF5GNHSR5RE756SUY",
    "clusters": [
        {
            "name": "kubernetes cloud",
            "address": {
                "protocol": "http",
                "port": "80",
                "host": "33.33.33.33"
            }
        },
        {
            "name": "kubernetes on premise",
            "address": {
                "protocol": "http",
                "port": "80",
                "host": "11.11.11.11"
            },
            "additional_headers": {
                "Host": "cloud-assistant.mydomain.com.br"
            }
        }
    ]
}

```
