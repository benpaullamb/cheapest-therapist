import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Therapist } from '../../types';

const getBACPUrl = (search: string, distance: number, location: string): URL => {
  const url = new URL('https://www.bacp.co.uk/search/Therapists');
  url.searchParams.append('q', search);
  url.searchParams.append('Distance', String(distance));
  url.searchParams.append('LocationQuery', location);
  url.searchParams.append('Location', 'Microsoft.Spatial.GeographyPointImplementation');
  url.searchParams.append('TherapistSortOrderSelectionMade', 'false');
  url.searchParams.append('SortOrder', '1');
  return url;
};

const getTotalTherapists = async (url: URL): Promise<number> => {
  const html = await axios.get(url.href);
  const { window } = new JSDOM(html.data);

  const searchMeta = window.document
    .querySelector('.template-search__metadata')
    ?.textContent?.trim()!;

  const words = searchMeta.split(' ');
  return Number(words[words.length - 1].slice(0, -1));
};

const getTherapistsOnPage = async (url: URL, page: number): Promise<Therapist[]> => {
  const nextUrl = new URL(url);
  nextUrl.searchParams.append('skip', String((page - 1) * 10));

  const html = await axios.get(nextUrl.href);
  const { window } = new JSDOM(html.data);

  const searchResults = Array.from(window.document.querySelectorAll('article.search-result'));

  const therapists = searchResults.map((result) => {
    const priceText = result.querySelector('strong.pullout-value__value')?.textContent;
    const price = Number(priceText?.trim().slice(1)) || 0;

    const titleLink = result.querySelector('a.search-result__link');
    const [name, city] = titleLink?.textContent?.trim().split(' - ')!;
    const link = 'https://www.bacp.co.uk' + (titleLink as HTMLAnchorElement).href;

    const description = result
      .querySelector('.content.search-result__content')
      ?.textContent?.trim()!;

    const plainImage = result.querySelector('img')?.src!;
    const image = plainImage.startsWith('/') ? `https://www.bacp.co.uk${plainImage}` : plainImage;

    return {
      name,
      image,
      price,
      description,
      link,
      city,
    };
  });

  return therapists;
};

const getAllTherapists = async (url: URL, maxPages: number): Promise<Therapist[]> => {
  let therapists: Therapist[] = [];

  const totalTherapists = await getTotalTherapists(url);
  const totalPages = Math.ceil(totalTherapists / 10);
  const pagesToSearch = Math.min(totalPages, maxPages);

  for (let page = 1; page <= pagesToSearch; page++) {
    const nextTherapists = await getTherapistsOnPage(url, page);
    therapists = [...therapists, ...nextTherapists];
  }

  return therapists.sort((a, b) => a.price - b.price).filter((therapist) => therapist.price);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Therapist[]>) {
  const search = req.query.search as string || '';
  const distance = Number(req.query.distance as string || '10');
  const location = req.query.location as string;
  const url = getBACPUrl(search, distance, location);

  if(!location) {
    return res.status(200).json([]); 
  }

  const therapists = await getAllTherapists(url, 10);
  res.status(200).json(therapists);
}
