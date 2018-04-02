# Entryphone

This little AWS Lambda app can power an apartment entryphone.

## How it works

- You set up your Twilio number in the entryphone system.

- When someone buzzes through the entryphone, all the numbers listed in the
  `ADMINS` config option will ring simultaneously, allowing anyone from your
  household to unlock the door.

- If a text is sent to the Twilio number, a special mode is activated whereby
  instead of calling the `ADMINS`, the door will automatically unlock. This
  mode will last `UNLOCK_TIMEOUT` seconds.

## Pre-requisites

- A Twilio account
- An AWS account, with access keys set up locally

To use:

1. Install dependencies, including [serverless](https://serverless.com)

        yarn global add serverless
        yarn install

2. Create a configuration file. An example is provided [here](config.example.yml).

        cp config.example.yml config.prod.yml
        # now edit config.prod.yml

3. Deploy to AWS

        serverless deploy -s prod

4. Take the URLs that serverless spits out and set them up in Twilio's
   UI as the call and SMS endpoints.
