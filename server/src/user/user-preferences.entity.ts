import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';

export enum PreferenceType {
  DASHBOARD_LAYOUT = 'dashboard_layout',
  THEME = 'theme',
  LANGUAGE = 'language',
  TIMEZONE = 'timezone',
  NOTIFICATION_SETTINGS = 'notification_settings',
  DEFAULT_VIEW = 'default_view',
  TABLE_SETTINGS = 'table_settings',
  CHART_PREFERENCES = 'chart_preferences',
  EXPORT_FORMAT = 'export_format',
  PAGE_SIZE = 'page_size'
}

registerEnumType(PreferenceType, {
  name: 'PreferenceType',
  description: 'Types of user preferences'
});

@ObjectType()
@Entity({ name: 'user_preferences' })
@Unique(['userId', 'preferenceType'])
export class UserPreferences {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'user_id' })
  userId: number;

  @Field(() => PreferenceType)
  @Column({
    name: 'preference_type',
    type: 'varchar'
  })
  preferenceType: PreferenceType;

  @Field()
  @Column({ type: 'text' })
  value: string; // JSON string to store complex preference values

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper methods for parsing values
  get parsedValue(): any {
    try {
      return JSON.parse(this.value);
    } catch {
      return this.value;
    }
  }

  setParsedValue(value: any): void {
    this.value = typeof value === 'string' ? value : JSON.stringify(value);
  }
}
