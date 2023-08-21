import { useState } from 'react';
import Image from 'next/image';
import { Therapist } from '../types';
import axios from 'axios';

export default function Home() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [bacpUrl, setBacpUrl] = useState<string>('');

  async function getTherapists() {
    setTherapists([]);

    const url = new URL(bacpUrl);
    const search = url.searchParams.get('q');
    const distance = url.searchParams.get('Distance');
    const location = url.searchParams.get('LocationQuery');

    const nextUrl = new URL('/api/therapists', 'http://localhost');
    nextUrl.searchParams.append('search', search!);
    nextUrl.searchParams.append('distance', distance!);
    nextUrl.searchParams.append('location', location!);

    const { data } = await axios.get(nextUrl.pathname + nextUrl.search);
    setTherapists(data);
    console.log(data);
  }

  function formatPrice(price: number): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    });

    return formatter.format(price);
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-4xl text-blue-600">Cheapest Therapist</h1>

      <span className="mb-4 block">Search on BACP then copy the URL here:</span>

      <input
        className="w-full p-2 mb-4 border border-blue-600 rounded"
        value={bacpUrl}
        onChange={(e) => setBacpUrl(e.target.value)}
        type="text"
        placeholder="Enter a BACP URL"
      />

      <button
        onClick={getTherapists}
        className="w-full px-4 py-2 mb-4 block text-white bg-blue-600 rounded text-center">
        Search
      </button>

      <div>
        {therapists.length === 0 && <span>Loading...</span>}

        {therapists.map(({ name, price, city, description, link, image }, i) => (
          <div className="mb-4 last:mb-0 flex flex-col gap-2" key={i}>
            <div className="h-64 relative">
              <Image src={image} alt={name} fill className="object-cover object-center" />
            </div>
            <span className="block text-blue-600 text-xl">{name}</span>
            <span className="block text-2xl">{formatPrice(price)}</span>
            <p>{description}</p>
            <span className="block">{city}</span>
            <a
              href={link}
              target="_blank"
              className="px-4 py-2 block text-white bg-blue-600 rounded text-center">
              View Profile
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
