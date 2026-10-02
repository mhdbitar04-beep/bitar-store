<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Converts any exception into the single JSON error contract used by the API:
 *
 *   { "message": "Human readable", "code": "machine_code", "errors": { "field": ["..."] } }
 */
final class ApiExceptionRenderer
{
    private const CODES = [
        400 => 'bad_request',
        401 => 'unauthenticated',
        403 => 'forbidden',
        404 => 'not_found',
        405 => 'method_not_allowed',
        409 => 'conflict',
        419 => 'session_expired',
        422 => 'validation_error',
        429 => 'too_many_requests',
        500 => 'server_error',
        503 => 'service_unavailable',
    ];

    public static function render(Throwable $e): ?JsonResponse
    {
        // Already carries its own response — let the framework send it.
        if ($e instanceof HttpResponseException) {
            return null;
        }

        return match (true) {
            $e instanceof ValidationException => self::json(
                422,
                $e->getMessage(),
                'validation_error',
                $e->errors(),
            ),
            $e instanceof AuthenticationException => self::json(401, 'Unauthenticated.', 'unauthenticated'),
            $e instanceof BusinessException => self::json($e->status, $e->getMessage(), $e->errorCode, $e->errors),
            $e instanceof HttpExceptionInterface => self::fromHttp($e),
            default => self::serverError($e),
        };
    }

    private static function fromHttp(HttpExceptionInterface $e): JsonResponse
    {
        $status = $e->getStatusCode();

        $message = match ($status) {
            // Hide "No query results for model [App\Models\X]" implementation details.
            404 => 'Resource not found.',
            403 => $e->getMessage() !== '' && $e->getMessage() !== 'This action is unauthorized.'
                ? $e->getMessage()
                : 'You are not allowed to perform this action.',
            default => $e->getMessage() !== '' ? $e->getMessage() : (Response::$statusTexts[$status] ?? 'Error'),
        };

        return self::json($status, $message, self::CODES[$status] ?? 'http_error', [], $e->getHeaders());
    }

    private static function serverError(Throwable $e): JsonResponse
    {
        // Reporting (logging) is done by the framework before rendering.
        $payload = config('app.debug')
            ? ['exception' => $e::class, 'detail' => $e->getMessage()]
            : [];

        return self::json(500, 'Something went wrong. Please try again later.', 'server_error', [], [], $payload);
    }

    /**
     * @param  array<string, mixed>  $errors
     * @param  array<string, string>  $headers
     * @param  array<string, mixed>  $extra
     */
    private static function json(
        int $status,
        string $message,
        string $code,
        array $errors = [],
        array $headers = [],
        array $extra = [],
    ): JsonResponse {
        $body = ['message' => $message, 'code' => $code];

        if ($errors !== []) {
            $body['errors'] = $errors;
        }

        return new JsonResponse($body + $extra, $status, $headers);
    }
}
