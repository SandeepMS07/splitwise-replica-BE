import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

export { ApiError } from "./errors";

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse(
      {
        error: {
          message: error.message,
          code: error.code ?? "API_ERROR"
        }
      },
      error.status
    );
  }

  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten()
        }
      },
      400
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonResponse(
        {
          error: {
            message: "Unique constraint failed",
            code: "UNIQUE_CONSTRAINT",
            details: error.meta
          }
        },
        409
      );
    }

    if (error.code === "P2025") {
      return jsonResponse(
        {
          error: {
            message: "Resource not found",
            code: "NOT_FOUND",
            details: error.meta
          }
        },
        404
      );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return jsonResponse(
      {
        error: {
          message: "Invalid database input",
          code: "DB_VALIDATION_ERROR"
        }
      },
      400
    );
  }

  return jsonResponse(
    {
      error: {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR"
      }
    },
    500
  );
}

export function parseIdParam(id: string | undefined) {
  if (!id) {
    throw new ApiError(400, "Missing id");
  }
  return id;
}

export function withApiHandler<Args extends unknown[], Result extends Response>(
  handler: (...args: Args) => Promise<Result>
) {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
