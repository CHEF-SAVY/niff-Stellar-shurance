import { Controller, Get, Headers, NotFoundException } from '@nestjs/common';
import { Feature } from '../feature-flags/feature.decorator';
import { RAMP_FEATURE_FLAG } from './ramp.constants';

const ALLOWED_REGIONS = (process.env.RAMP_ALLOWED_REGIONS ?? '')
  .split(',')
  .map((r) => r.trim().toUpperCase())
  .filter(Boolean);

const RAMP_BASE_URL = process.env.RAMP_URL ?? '';
const UTM_SOURCE = process.env.RAMP_UTM_SOURCE ?? 'niffyinsure';
const UTM_MEDIUM = process.env.RAMP_UTM_MEDIUM ?? 'app';
const UTM_CAMPAIGN = process.env.RAMP_UTM_CAMPAIGN ?? 'onramp';

@Controller('ramp')
export class RampController {
  @Get('config')
  @Feature(RAMP_FEATURE_FLAG)
  getConfig(@Headers('x-region') region: string | undefined) {
    const normalised = (region ?? '').toUpperCase();

    if (ALLOWED_REGIONS.length > 0 && !ALLOWED_REGIONS.includes(normalised)) {
      throw new NotFoundException('Ramp not available in your region');
    }

    const url = new URL(RAMP_BASE_URL);
    url.searchParams.set('utm_source', UTM_SOURCE);
    url.searchParams.set('utm_medium', UTM_MEDIUM);
    url.searchParams.set('utm_campaign', UTM_CAMPAIGN);

    return { url: url.toString() };
  }
}
