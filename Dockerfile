FROM public.ecr.aws/lambda/python:3.12

# Copy the requirements.txt into the container
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY src/* ${LAMBDA_TASK_ROOT}

# Ensure Lambda is using the RIE
CMD [ "main.handler" ]

