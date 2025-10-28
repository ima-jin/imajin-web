import { NotFoundDisplay } from '@/components/error/NotFoundDisplay';

export default function ProductNotFound() {
  return (
    <NotFoundDisplay
      resource="Product"
      message="The product you're looking for doesn't exist or has been removed from our catalog."
    />
  );
}
