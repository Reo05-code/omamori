/**
 * 位置情報とデバイス情報の取得ユーティリティ
 */

export type GeolocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type DeviceInfo = {
  batteryLevel?: number; // 取得できない場合はundefined
};

/**
 * 現在位置を取得
 */
export async function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('位置情報がサポートされていません'));
      return;
    }

    // 10秒以内に取得できなければタイムアウト
    // 30秒以内のキャッシュを許容
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = '位置情報の取得に失敗しました';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '位置情報の利用が許可されていません。設定から許可してください';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置情報が利用できません';
            break;
          case error.TIMEOUT:
            message = '位置情報の取得がタイムアウトしました';
            break;
        }
        reject(new Error(message));
      },
      options,
    );
  });
}

/**
 * バッテリーレベルを取得（0-100）
 * Battery Status API非対応の場合はundefinedを返す
 */
export async function getBatteryLevel(): Promise<number | undefined> {
  try {
    // Battery Status APIはまだ一部ブラウザでしか使えない
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return Math.round(battery.level * 100);
    }
  } catch (err) {
    // 取得エラー時はundefinedを返す
    return undefined;
  }

  // 非対応の場合もundefinedを返す（呼び出し側で適切に処理）
  return undefined;
}

/**
 * 位置情報とバッテリーレベルをまとめて取得
 * 位置情報が取れなくてもバッテリーは返す
 */
export async function getDeviceInfoWithLocation(): Promise<
  (GeolocationResult & DeviceInfo) | null
> {
  try {
    const [position, batteryLevel] = await Promise.all([getCurrentPosition(), getBatteryLevel()]);

    return {
      ...position,
      batteryLevel,
    };
  } catch (err) {
    // 位置情報取得失敗時はnullを返す（呼び出し側でエラー処理）
    return null;
  }
}

/**
 * バッテリーレベルのみ取得（位置情報不要な場合）
 */
export async function getDeviceInfoOnly(): Promise<DeviceInfo> {
  const batteryLevel = await getBatteryLevel();
  return { batteryLevel };
}

type BestEffortPositionOptions = {
  timeoutMs?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
};

/**
 * SOS等「送信できないことが最悪」な導線向けの位置情報取得
 * - 取得に失敗しても例外は投げず null を返す
 * - timeout を短めに設定し、UI をブロックしすぎない
 */
export async function getCurrentPositionBestEffort(
  options: BestEffortPositionOptions = {},
): Promise<GeolocationResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const { timeoutMs = 4000, enableHighAccuracy = true, maximumAge = 0 } = options;

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout: timeoutMs,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      positionOptions,
    );
  });
}
