import { useState, useEffect } from 'react';
import axiosApi from '@/lib/axios';

export function useSecureImage(src: string | null | undefined) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        let currentObjectUrl: string | null = null;

        // Reset state when src changes
        if (!src) {
            setObjectUrl(null);
            setIsLoading(false);
            setError(null);
        } else {
            const fetchImage = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    // Start: Refactored to use axiosApi for automatic token handling and refresh
                    const response = await axiosApi.get(src, {
                        responseType: 'blob', // Important: request blob data
                        headers: {
                            // axiosApi interceptor adds Authorization header automatically
                        }
                    });

                    if (isMounted) {
                        const blob = response.data;
                        currentObjectUrl = URL.createObjectURL(blob);
                        setObjectUrl(currentObjectUrl);
                        setIsLoading(false);
                    }
                    // End: Refactored
                } catch (err: any) {
                    console.error('Image fetch error:', err);
                    if (isMounted) {
                        setError(err);
                        setIsLoading(false);
                    }
                }
            };

            fetchImage();
        }

        return () => {
            isMounted = false;
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
        };
    }, [src]);

    return { objectUrl, isLoading, error };
}
