# Start with the python 3.10 slim image
FROM python:3.10-slim

# Copy the AWS credentials from the root directory to the container
COPY .aws /root/.aws

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements.txt into the container
COPY . /app

# Install gcc and other dependencies
RUN apt-get update && apt-get install -y gcc

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the source code into the container
COPY . .

# Set the entrypoint for the lambda function
CMD [ "python", "main.py" ]
