import { BadGatewayException, Injectable } from "@nestjs/common";

@Injectable()
export class AureoNatureBridgeService {
  async anchorAlert(payload: unknown, targetUrl = process.env.AUREO_BRIDGE_URL) {
    const url = targetUrl?.trim();
    if (!url) {
      throw new BadGatewayException("AUREO_BRIDGE_URL is not configured");
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new BadGatewayException(`Aureo bridge is unreachable: ${String(error)}`);
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new BadGatewayException({
        message: "Aureo bridge rejected the environmental alert",
        status: response.status,
        body,
      });
    }
    return body;
  }
}
